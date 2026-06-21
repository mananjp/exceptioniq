from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('organizations', '0001_initial'),
        ('entities', '0002_entity_tally_company_name_entity_zoho_access_token_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='entity',
            name='organization',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='entities',
                to='organizations.organization',
            ),
        ),
    ]
